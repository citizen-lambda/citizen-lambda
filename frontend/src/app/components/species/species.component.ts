import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TaxonomyService } from '../../services/taxonomy.service';
import { Taxonomy, Taxon } from '../../core/models';

@Component({
  selector: 'app-species',
  templateUrl: './species.component.html',
  styleUrls: ['./species.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SpeciesComponent implements OnInit {
  title = 'fiche espèce';
  specie_id: any;
  taxon!: Taxon;

  constructor(private route: ActivatedRoute, public taxonomy: TaxonomyService) {
    this.route.params.subscribe(params => {
      this.specie_id = params['id'];
    });
  }

  ngOnInit() {
    console.log('PARAMS', this.specie_id);
    this.taxonomy.getTaxon(this.specie_id).subscribe(taxon => {
      this.taxon = taxon;
      console.debug('TAXON', taxon);
    });
  }
}
